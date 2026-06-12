"use client";

import { useEffect, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { erc20Abi } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { type Token } from "@/lib/tokens";

export default function TransferForm({
  selectedToken,
  onSuccess,
}: {
  selectedToken: Token | null;
  onSuccess: () => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    setTo("");
    setAmount("");
    reset();
    onSuccess();
  }, [isSuccess, reset, onSuccess]);

  if (!selectedToken) {
    return (
      <p className="text-gray-400 text-sm mt-6">
        Select a token above to transfer.
      </p>
    );
  }

  const isValidTo = isAddress(to);
  const isValidAmount = !!amount && Number(amount) > 0;
  const canSubmit = isValidTo && isValidAmount && !isPending && !isConfirming;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    writeContract({
      address: selectedToken!.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to as `0x${string}`, parseUnits(amount, selectedToken!.decimals)],
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 p-4 rounded-lg border border-gray-200 space-y-3"
    >
      <h2 className="font-semibold">Transfer {selectedToken.symbol}</h2>

      <div className="space-y-2">
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          placeholder="Recipient address (0x...)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        {to && !isValidTo && (
          <p className="text-red-500 text-xs">Invalid address</p>
        )}
      </div>

      <div className="space-y-2">
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder={`Amount in ${selectedToken.symbol}`}
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-black text-white py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending
          ? "Waiting for wallet..."
          : isConfirming
            ? "Confirming on chain..."
            : `Send ${selectedToken.symbol}`}
      </button>

      {isSuccess && (
        <p className="text-green-600 text-sm">
          Transfer confirmed!{" "}
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Etherscan
          </a>
        </p>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error.message.split("\n")[0]}</p>
      )}
    </form>
  );
}
