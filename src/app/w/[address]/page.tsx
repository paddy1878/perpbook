import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { isAddress } from "@/lib/hyperliquid/client";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  return { title: address === "demo" ? "Demo journal · perpbook" : `${address.slice(0, 6)}…${address.slice(-4)} · perpbook` };
}

export default async function WalletPage({ params }: Props) {
  const { address } = await params;
  if (address !== "demo" && !isAddress(address)) notFound();
  return <Dashboard address={address === "demo" ? "demo" : address.toLowerCase()} />;
}
