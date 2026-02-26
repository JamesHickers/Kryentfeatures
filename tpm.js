// tpm.js - Krynet production-ready ephemeral TPM security module
// Fully in-memory; optional WebAuthn; message encryption helper
class KrynetTPM {
  constructor(auth0Client) {
    this.auth0 = auth0Client;
    this.deviceKey = null;       // ephemeral TPM key
    this.TPM = null;
  }

  // Dynamically load TPM-JS WASM
  async loadTPM() {
    if (this.TPM) return this.TPM;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://rawcdn.githack.com/google/tpm-js/8c2e2b0/dist/tpm.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    this.TPM = window.TPM;
    await this.TPM.init();
    return this.TPM;
  }

  // Generate ephemeral TPM key (ECC primary)
  async generateKey() {
    const TPM = await this.loadTPM();
    const { privateKey, publicKey } = TPM.CreatePrimary({ alg: TPM.TPM_ALG_ECC });
    this.deviceKey = { privateKey, publicKey };
    return publicKey;
  }

  // Sign data with ephemeral TPM key
  async sign(data) {
    if (!this.deviceKey) await this.generateKey();
    const TPM = await this.loadTPM();
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return TPM.Sign({ keyHandle: this.deviceKey.privateKey, digest, scheme: TPM.TPM_ALG_ECDSA });
  }

  // Optional WebAuthn for hardware-backed keys
  async webAuthnSign(challenge) {
    if (!window.PublicKeyCredential) return null;
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(challenge),
          userVerification: 'required',
        },
      });
      return assertion.response.signature;
    } catch {
      return null;
    }
  }

  // Prepare ephemeral security payload for Krynet actions
  async getSecurityPayload(serverChallenge) {
    if (!this.deviceKey) await this.generateKey();
    const tpmSignature = await this.sign(serverChallenge);
    const webAuthnSignature = await this.webAuthnSign(serverChallenge);
    const user = await this.auth0.getUser();
    return {
      auth0Sub: user?.sub || null,
      tpmPublicKey: this.deviceKey.publicKey,
      tpmSignature,
      webAuthnSignature
    };
  }

  // Encrypt a message using ephemeral TPM key (ECIES-like)
  async encryptMessage(plaintext) {
    if (!this.deviceKey) await this.generateKey();
    const TPM = await this.loadTPM();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    return TPM.Encrypt({ keyHandle: this.deviceKey.publicKey, data });
  }

  // Decrypt a message using ephemeral TPM key
  async decryptMessage(ciphertext) {
    if (!this.deviceKey) throw new Error('No ephemeral TPM key available');
    const TPM = await this.loadTPM();
    const decrypted = TPM.Decrypt({ keyHandle: this.deviceKey.privateKey, ciphertext });
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Destroy ephemeral TPM key (session end)
  destroyKey() {
    this.deviceKey = null;
  }
}

// Singleton instance
let tpmInstance = null;
export function getKrynetTPM(auth0Client) {
  if (!tpmInstance) tpmInstance = new KrynetTPM(auth0Client);
  return tpmInstance;
}
