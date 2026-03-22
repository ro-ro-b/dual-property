/**
 * Session Wallet - Client-side session store for claimed wine tokens
 *
 * This module provides a simple abstraction over the wallet API routes.
 * All state is persisted via HTTP-only cookies on the server.
 *
 * Architecture:
 * - POST /api/wallet/claim: Claim a wine token (adds objectId to session cookie)
 * - GET /api/wallet: Fetch claimed wine IDs from session cookie
 * - DELETE /api/wallet: Clear the wallet (delete session cookie)
 */

export interface WalletResponse {
  claimedIds: string[];
}

export interface ClaimResponse {
  success: boolean;
  claimedIds: string[];
}

/**
 * Fetch the list of claimed wine token IDs from the session wallet
 */
export async function getClaimedWines(): Promise<string[]> {
  try {
    const response = await fetch('/api/wallet');
    const data: WalletResponse = await response.json();
    return data.claimedIds || [];
  } catch (error: unknown) {
    console.error('Failed to fetch claimed wines:', error);
    return [];
  }
}

/**
 * Claim a wine token by its objectId
 * Stores the claim in a server-side HTTP-only cookie
 */
export async function claimWine(objectId: string): Promise<ClaimResponse | null> {
  try {
    const response = await fetch('/api/wallet/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ClaimResponse = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('Failed to claim wine:', error);
    return null;
  }
}

/**
 * Check if a wine token is already claimed
 */
export async function isWineClaimed(objectId: string): Promise<boolean> {
  const claimedIds = await getClaimedWines();
  return claimedIds.includes(objectId);
}

/**
 * Clear the entire wallet (remove all claimed wines)
 */
export async function clearWallet(): Promise<boolean> {
  try {
    const response = await fetch('/api/wallet', { method: 'DELETE' });
    return response.ok;
  } catch (error: unknown) {
    console.error('Failed to clear wallet:', error);
    return false;
  }
}
