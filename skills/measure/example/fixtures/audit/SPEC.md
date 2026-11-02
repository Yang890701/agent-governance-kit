# Spec: login rate limiter (ticket AUTH-42)

1. Each **user** may attempt login at most **5 times per rolling 60 seconds**. The 6th attempt inside the window is rejected.
2. Limits are **per user** — one user hitting the limit must not affect any other user.
3. A **successful** login resets that user's counter.
4. Rejected attempts must **not** extend the lockout (they are not counted).
5. `isAllowed(userId, nowMs)` returns true/false; `recordSuccess(userId)` resets.
