package elearning.exception;

/** Gửi yêu cầu quá dày (ví dụ xin mã đặt lại mật khẩu liên tục): trả HTTP 429 kèm Retry-After. */
public class TooManyRequestsException extends RuntimeException {
    private final long retryAfterSeconds;

    public TooManyRequestsException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
