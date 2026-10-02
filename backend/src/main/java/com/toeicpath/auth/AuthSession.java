package com.toeicpath.auth;

import com.toeicpath.auth.dto.AuthResponse;

record AuthSession(AuthResponse response, String refreshToken) {
}