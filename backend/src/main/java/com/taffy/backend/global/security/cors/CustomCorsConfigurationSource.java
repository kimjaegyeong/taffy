package com.taffy.backend.global.security.cors;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

public class CustomCorsConfigurationSource extends UrlBasedCorsConfigurationSource {

    public CustomCorsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://i11e104.p.ssafy.io:3000","https://i11e104.p.ssafy.io",
                "http://localhost:5173"));

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        registerCorsConfiguration("/**", config);
    }
}
