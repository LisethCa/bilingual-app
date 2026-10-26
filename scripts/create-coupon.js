// Crea o actualiza un cupón de 100% en coupons/<CÓDIGO>. Lo canjea el backend (/redeem-coupon).
// Sin --write solo muestra lo que haría.
//
//   node scripts/create-coupon.js <CÓDIGO> [--uses 40] [--levels A1,A2] [--expires 2026-12-31] [--write]
//   node scripts/create-coupon.js <CÓDIGO> --disable --write

const admin = require("firebase-admin");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const code = String(args[0] || "").trim().toUpperCase();
if (!code || code.startsWith("--") || code.includes("/")) {
  console.error("Uso: node scripts/create-coupon.js <CÓDIGO> [--uses 40] [--levels A1,A2] [--expires AAAA-MM-DD] [--write]");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require("../service-account-key.json")) });
const db = admin.firestore();

(async () => {
  const ref = db.collection("coupons").doc(code);
  const existing = await ref.get();

  const data = flag("disable")
    ? { active: false }
    : {
        levels: option("levels", "A1,A2").split(","),
        maxUses: Number(option("uses", 40)),
        active: true,
        ...(option("expires") && {
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(`${option("expires")}T23:59:59-05:00`)),
        }),
        ...(!existing.exists && { uses: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      };

  console.log(existing.exists ? `Existe: ${JSON.stringify(existing.data())}` : "Cupón nuevo");
  console.log(`${code} ->`, data);

  if (!flag("write")) {
    console.log("Dry-run. Agrega --write para guardarlo.");
  } else {
    await ref.set(data, { merge: true });
    console.log("Guardado.");
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
