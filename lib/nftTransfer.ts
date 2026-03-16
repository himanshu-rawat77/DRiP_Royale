import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js";

function getConnection(): Connection {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "mainnet-beta" : "devnet";
  return new Connection(clusterApiUrl(network), "confirmed");
}

// Minimal devnet transfer placeholder to validate winner/withdrawal flow.
// Uses a memo-like 0-lamport self transfer while mint is still tracked in ledger metadata.
export async function transferNft(
  fromKeypair: Keypair,
  toPublicKey: PublicKey,
  mint: string,
): Promise<string> {
  const connection = getConnection();
  const instruction = SystemProgram.transfer({
    fromPubkey: fromKeypair.publicKey,
    toPubkey: toPublicKey,
    lamports: 0,
  });

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = fromKeypair.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
  if (!signature) {
    throw new Error(`Transfer failed for mint ${mint}`);
  }
  return signature;
}
