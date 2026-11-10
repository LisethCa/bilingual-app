// hooks/useAuth.ts
import { router, usePathname } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth, checkAuthState } from "../lib/firebaseConfig";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  lastActive: Date | null;
  checkSession: () => Promise<boolean>;
  /** Fuerza re-render tras updateProfile (que no dispara onAuthStateChanged). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  lastActive: null,
  checkSession: async () => false,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActive, setLastActive] = useState<Date | null>(null);
  const [, setUserVersion] = useState(0);
  const pathname = usePathname();

  // Tiempo de caducidad de sesión (1 hora en milisegundos)
  const SESSION_EXPIRATION_TIME = 60 * 60 * 1000;

  const checkSession = async (): Promise<boolean> => {
    if (!user) return false;

    // Verificar si el token ha caducado
    try {
      const idTokenResult = await user.getIdTokenResult();

      // Verificar expiración del token
      const expirationTime = idTokenResult.claims.exp as number | undefined;
      if (!expirationTime || expirationTime * 1000 < Date.now()) {
        console.log("Token expired, signing out...");
        await signOut(auth);
        return false;
      }

      // Verificar tiempo de inactividad
      if (
        lastActive &&
        Date.now() - lastActive.getTime() > SESSION_EXPIRATION_TIME
      ) {
        console.log("Session expired due to inactivity");
        await signOut(auth);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking session:", error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!mounted) return;

      // Solo actualiza si el usuario realmente cambió
      if (authUser?.uid !== user?.uid) {
        setUser(authUser);
        setLastActive(new Date());
      }

      if (authUser && pathname === "/login") {
        router.replace("/");
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [pathname, user?.uid]); // Agrega user?.uid como dependencia

  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        const isValid = await checkSession();
        if (!isValid) {
          router.replace("/login");
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const refreshUser = async () => {
    try {
      await auth.currentUser?.reload();
    } catch (error) {
      console.error("Error reloading user:", error);
    }
    setUser(auth.currentUser);
    setUserVersion((v) => v + 1);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, lastActive, checkSession, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
