package com.natalvagas.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${natalvagas.security.editdev-api-key}")
    private String editdevApiKey;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Endpoints Públicos de Leitura
                .requestMatchers(HttpMethod.GET, "/jobs/**", "/categories/**", "/sitemap.xml").permitAll()
                .requestMatchers("/docs/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").hasRole("EDITDEV")
                // Aprovação e exclusão Administrativa de Vagas protegidas
                .requestMatchers(HttpMethod.PATCH, "/jobs/*/approve").hasRole("EDITDEV")
                .requestMatchers(HttpMethod.DELETE, "/jobs/**").hasRole("EDITDEV")
                // A API Spring não mantém sessões de empresa; publicação ocorre pela função edge autenticada.
                .requestMatchers(HttpMethod.POST, "/jobs").hasRole("EDITDEV")
                .anyRequest().authenticated()
            )
            .addFilterBefore(editdevKeyAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public OncePerRequestFilter editdevKeyAuthenticationFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                String apiKey = request.getHeader("X-Editdev-Key");

                if (apiKey != null && apiKey.equals(editdevApiKey)) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            "editdev",
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_EDITDEV"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }

                filterChain.doFilter(request, response);
            }
        };
    }
}
