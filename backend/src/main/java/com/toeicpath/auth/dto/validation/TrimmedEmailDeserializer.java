package com.toeicpath.auth.dto.validation;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.util.Locale;

public class TrimmedEmailDeserializer extends JsonDeserializer<String> {
    @Override
    public String deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String email = parser.getValueAsString();
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}