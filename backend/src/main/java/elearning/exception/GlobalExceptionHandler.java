package elearning.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, Object>> badRequest(
            IllegalArgumentException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, exception.getMessage(), request, null);
    }

    @ExceptionHandler(TooManyRequestsException.class)
    ResponseEntity<Map<String, Object>> tooManyRequests(
            TooManyRequestsException exception, HttpServletRequest request) {
        ResponseEntity<Map<String, Object>> entity =
                response(HttpStatus.TOO_MANY_REQUESTS, exception.getMessage(), request, null);
        entity.getBody().put("retryAfterSeconds", exception.getRetryAfterSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(exception.getRetryAfterSeconds()))
                .body(entity.getBody());
    }

    @ExceptionHandler(LearningAccessException.class)
    ResponseEntity<Map<String, Object>> learningAccess(
            LearningAccessException exception, HttpServletRequest request) {
        ResponseEntity<Map<String, Object>> entity =
                response(HttpStatus.FORBIDDEN, exception.getMessage(), request, null);
        entity.getBody().put("code", exception.getCode());
        if (exception.getCourseId() != null) entity.getBody().put("courseId", exception.getCourseId());
        if (exception.getLessonId() != null) entity.getBody().put("lessonId", exception.getLessonId());
        return entity;
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<Map<String, Object>> unauthorized(
            AuthenticationException exception, HttpServletRequest request) {
        ResponseEntity<Map<String, Object>> entity =
                response(HttpStatus.UNAUTHORIZED, exception.getMessage(), request, null);
        if (exception instanceof LockedException) entity.getBody().put("code", "ACCOUNT_LOCKED");
        return entity;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validation(
            MethodArgumentNotValidException exception, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        exception
                .getBindingResult()
                .getFieldErrors()
                .forEach(
                        error ->
                                fieldErrors.putIfAbsent(
                                        error.getField(), error.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", request, fieldErrors);
    }

    @ExceptionHandler({ConstraintViolationException.class, HttpMessageNotReadableException.class})
    ResponseEntity<Map<String, Object>> malformedRequest(
            Exception exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không hợp lệ", request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, Object>> conflict(
            DataIntegrityViolationException exception, HttpServletRequest request) {
        return response(
                HttpStatus.CONFLICT, "Dữ liệu đã tồn tại hoặc đang được sử dụng", request, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<Map<String, Object>> uploadTooLarge(
            MaxUploadSizeExceededException exception, HttpServletRequest request) {
        return response(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "File vượt quá dung lượng cho phép (tối đa 20 MB)",
                request,
                null);
    }

    @ExceptionHandler(IOException.class)
    ResponseEntity<Map<String, Object>> storageError(
            IOException exception, HttpServletRequest request) {
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Không thể lưu file âm thanh. Vui lòng thử lại",
                request,
                null);
    }

    private ResponseEntity<Map<String, Object>> response(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", request.getRequestURI());
        if (fieldErrors != null && !fieldErrors.isEmpty()) body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
