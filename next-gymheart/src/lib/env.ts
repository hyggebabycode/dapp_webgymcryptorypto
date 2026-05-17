export const env = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://chfbdpcgstloqoairtrs.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZmJkcGNnc3Rsb3FvYWlydHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODIwMDEsImV4cCI6MjA4NTg1ODAwMX0.AtpjoPgPFrcMWnt9X3yHmTvOMgXFtb3vNvxptPqJpsU",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  cookieSecret:
    process.env.AUTH_COOKIE_SECRET ||
    "dev-only-change-this-cookie-secret-before-deploying",
  paymentContractAddress:
    process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS ||
    "0x0d65e4f39748FB912850c4871d0a05A65821623F",
  sapphireRpcUrl:
    process.env.SAPPHIRE_TESTNET_RPC_URL ||
    process.env.NEXT_PUBLIC_SAPPHIRE_TESTNET_RPC_URL ||
    "https://testnet.sapphire.oasis.dev",
  vndPerTest: Number(process.env.NEXT_PUBLIC_VND_PER_TEST || 1000000),
};
