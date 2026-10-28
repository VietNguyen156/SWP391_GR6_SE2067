package elearning.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Trạng thái nội dung giáo viên được chọn chỉ có Hiển thị (PUBLISHED) hoặc Ẩn (DRAFT). Các giá
 * trị cũ khác của enum (HIDDEN, ARCHIVED...) vẫn còn trong DB nhưng không được tạo mới.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = VisibilityStatus.Validator.class)
public @interface VisibilityStatus {
    String message() default "Trạng thái chỉ được là Hiển thị hoặc Ẩn";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<VisibilityStatus, Enum<?>> {
        @Override
        public boolean isValid(Enum<?> value, ConstraintValidatorContext context) {
            return value == null || value.name().equals("PUBLISHED") || value.name().equals("DRAFT");
        }
    }
}
