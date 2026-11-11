package edu.unsa.epcc.loans.support;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;

/** Clase base de las pruebas de integración: arranca la aplicación contra un PostgreSQL 16 real en Docker. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    /**
     * Un único contenedor para toda la ejecución de pruebas. Se inicia una vez y Testcontainers lo elimina al
     * terminar; así Spring puede reutilizar el mismo contexto en todas las clases de prueba.
     */
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16");

    static {
        POSTGRES.start();
    }
}
