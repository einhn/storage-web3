// backend/src/routes/authGoogle.ts
import { Router } from "express";
import fetch from "node-fetch";
import { prisma } from "../lib/prisma";
import { createUserWallet } from "../lib/wallet";

const router = Router();

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
};

type GoogleIdTokenInfo = {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  exp: string;
  iat: string;
};

// 1) 로그인 시작: Google OAuth 화면으로 리다이렉트
router.get("/google/start", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error("Google OAuth env not set");
    return res.status(500).send("Google OAuth not configured");
  }

  // CSRF 방지용 state: 해커톤이라 간단히 랜덤 문자열 + 쿠키
  const state = Math.random().toString(36).slice(2);
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(authUrl);
});

// 2) Google이 리다이렉트해주는 콜백: 토큰 교환 + 유저/지갑 생성
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    // state 검증 (간단 버전)
    const cookieState = req.cookies?.oauth_state;
    if (!cookieState || cookieState !== state) {
      return res.status(400).send("Invalid state");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const frontendBase = process.env.FRONTEND_BASE_URL;

    if (!clientId || !clientSecret || !redirectUri || !frontendBase) {
      console.error("Google OAuth env not set completely");
      return res.status(500).send("Google OAuth not configured");
    }

    // 2-1) code -> token 교환
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Google token error:", text);
      return res.status(502).send("Failed to exchange token");
    }

    const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;

    // 2-2) id_token 검증 (Google tokeninfo 사용)
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        tokenJson.id_token,
      )}`,
    );

    if (!infoRes.ok) {
      const text = await infoRes.text();
      console.error("Google tokeninfo error:", text);
      return res.status(401).send("Invalid id_token");
    }

    const info = (await infoRes.json()) as GoogleIdTokenInfo;

    if (info.aud !== clientId) {
      return res.status(401).send("Invalid audience");
    }
    if (
      info.iss !== "https://accounts.google.com" &&
      info.iss !== "accounts.google.com"
    ) {
      return res.status(401).send("Invalid issuer");
    }

    const googleId = info.sub;
    const email = info.email;

    // 2-3) 유저 찾기 / 없으면 생성 + 지갑 생성
    let user = await prisma.user.findFirst({
      where: {
        oauthProvider: "google",
        oauthId: googleId,
      },
    });

    if (!user) {
      const wallet = await createUserWallet();

      user = await prisma.user.create({
        data: {
          oauthProvider: "google",
          oauthId: googleId,
          walletAddress: wallet.address,
          walletJson: wallet.encryptedJson,
          // email 필드 있으면 여기에 email 저장
        },
      });
    } else if (!user.walletAddress || !user.walletJson) {
      // 기존 유저인데 지갑 없는 경우(데이터 migration용)
      const wallet = await createUserWallet();
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          walletAddress: wallet.address,
          walletJson: wallet.encryptedJson,
        },
      });
    }

    // 2-4) 프론트로 리다이렉트 (간단하게 쿼리로 전달)
    const redirectTo = new URL("/dashboard", frontendBase);
    redirectTo.searchParams.set("userId", user.id.toString());
    redirectTo.searchParams.set("wallet", user.walletAddress ?? "");

    return res.redirect(redirectTo.toString());
  } catch (err) {
    console.error("GET /auth/google/callback error:", err);
    return res.status(500).send("Internal error");
  }
});

export default router;