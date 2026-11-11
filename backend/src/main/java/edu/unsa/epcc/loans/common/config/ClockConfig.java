package edu.unsa.epcc.loans.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Expone el reloj del sistema (UTC) para que los servicios lo inyecten y las pruebas puedan fijar la hora. */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
