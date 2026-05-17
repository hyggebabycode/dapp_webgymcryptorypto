"use client";

import { useRef, useState } from "react";
import { BrowserProvider } from "ethers";
import { WalletCards } from "lucide-react";
import { createWalletChallengeAction, signupWithMetaMaskAction } from "@/lib/auth/actions";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Không thể đăng ký bằng MetaMask. Vui lòng thử lại.";
}

function base64UrlEncodeText(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function MetaMaskRegisterButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const walletInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function registerWithWallet() {
    setMessage("");

    if (!window.ethereum) {
      setMessage("Chưa thấy MetaMask trong trình duyệt.");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const challengeMessage = await createWalletChallengeAction({
        action: "signup",
        walletAddress: address,
      });
      const signature = await signer.signMessage(challengeMessage);

      if (walletInputRef.current) walletInputRef.current.value = address;

      const messageInput = formRef.current?.elements.namedItem("message_b64") as HTMLInputElement | null;
      const signatureInput = formRef.current?.elements.namedItem("signature") as HTMLInputElement | null;
      if (messageInput) messageInput.value = base64UrlEncodeText(challengeMessage);
      if (signatureInput) signatureInput.value = signature;

      setSubmitting(true);
      setMessage(`Đã kết nối ${shortAddress(address)}. Đang tạo tài khoản hội viên...`);
      formRef.current?.requestSubmit();
    } catch (error) {
      setSubmitting(false);
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <form action={signupWithMetaMaskAction} className="space-y-2" ref={formRef}>
      <input name="wallet_address" ref={walletInputRef} type="hidden" />
      <input name="message_b64" type="hidden" />
      <input name="signature" type="hidden" />
      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-white text-sm font-black text-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting}
        onClick={registerWithWallet}
        type="button"
      >
        <WalletCards size={20} />
        {submitting ? "Đang đăng ký..." : "Đăng ký nhanh với MetaMask"}
      </button>
      {message ? <p className="text-xs font-bold text-muted">{message}</p> : null}
    </form>
  );
}
