"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { recordWeb3PaymentAction } from "@/lib/payments/actions";
import { baseAmountToTest } from "@/lib/currency";

const SAPPHIRE_CHAIN_ID_HEX = "0x5AFF";
const PAYMENT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ADDRESS ||
  "0x0d65e4f39748FB912850c4871d0a05A65821623F";

const PAYMENT_ABI = [
  "function payForCourse(uint256 courseId) payable",
  "event CoursePaid(address indexed student, uint256 indexed courseId, uint256 amount)",
] as const;
const CART_KEY = "gymheart_cart";
const CART_EVENT = "gymheart-cart-changed";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function courseUuidToUint256(courseId: string) {
  return BigInt(`0x${courseId.replace(/-/g, "")}`).toString();
}

function removePaidCourseFromLocalCart(courseId: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return;

    const nextCart = parsed.filter((item) => {
      if (!item || typeof item !== "object") return false;
      return String((item as { id?: unknown }).id || "") !== courseId;
    });

    window.localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    // Local cart cleanup is best-effort; server state remains authoritative.
  }
}

function isUserRejectedError(error: unknown) {
  const maybeError = error as {
    code?: number | string;
    action?: string;
    reason?: string;
    info?: {
      error?: {
        code?: number | string;
      };
    };
  };

  return (
    maybeError.code === 4001 ||
    maybeError.code === "ACTION_REJECTED" ||
    maybeError.reason === "rejected" ||
    maybeError.info?.error?.code === 4001
  );
}

async function ensureSapphireNetwork() {
  if (!window.ethereum) {
    throw new Error("Vui lòng cài MetaMask.");
  }

  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  if (String(currentChainId).toLowerCase() === SAPPHIRE_CHAIN_ID_HEX.toLowerCase()) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SAPPHIRE_CHAIN_ID_HEX }],
    });
  } catch (error) {
    const maybeError = error as { code?: number };
    if (maybeError.code !== 4902) throw error;

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SAPPHIRE_CHAIN_ID_HEX,
          chainName: "Oasis Sapphire Testnet",
          nativeCurrency: { name: "TEST", symbol: "TEST", decimals: 18 },
          rpcUrls: ["https://testnet.sapphire.oasis.dev"],
        },
      ],
    });
  }
}

export function useWeb3Payment() {
  const [status, setStatus] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);

  async function payCourse(course: {
    id: string;
    price: number;
    course_name: string;
  }) {
    if (!window.ethereum) {
      throw new Error("Vui lòng cài MetaMask.");
    }

    setIsPaying(true);
    setStatus("Đang kết nối MetaMask...");

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await ensureSapphireNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYMENT_CONTRACT_ADDRESS,
        PAYMENT_ABI,
        signer,
      );
      const tokenAmount = baseAmountToTest(course.price)
        .toFixed(18)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
      const value = ethers.parseEther(tokenAmount);
      const onChainCourseId = courseUuidToUint256(course.id);

      setStatus(`Xác nhận ${tokenAmount} TEST trong MetaMask...`);
      const tx = await contract.payForCourse(onChainCourseId, { value });

      setStatus("Đang chờ giao dịch được xác nhận...");
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error("Giao dịch on-chain không thành công.");
      }

      setStatus("Giao dịch thành công. Đang mở khóa khóa học...");
      await recordWeb3PaymentAction({
        courseId: course.id,
        txHash: tx.hash,
        walletAddress: await signer.getAddress(),
      });
      removePaidCourseFromLocalCart(course.id);

      setStatus("Thanh toán thành công.");
      return tx.hash as string;
    } finally {
      setIsPaying(false);
    }
  }

  return {
    contractAddress: PAYMENT_CONTRACT_ADDRESS,
    isPaying,
    isUserRejectedError,
    payCourse,
    status,
  };
}
