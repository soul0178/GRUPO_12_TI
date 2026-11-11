package edu.unsa.epcc.loans;

import static org.assertj.core.api.Assertions.assertThat;

import edu.unsa.epcc.loans.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/** Prueba de arranque: la aplicación levanta y Flyway se conecta a PostgreSQL. */
class LoansApplicationTests extends IntegrationTestBase {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldStartApplicationAndConnectToPostgres() {
        String version = jdbcTemplate.queryForObject("select version()", String.class);

        assertThat(version).contains("PostgreSQL 16");
    }

    @Test
    void shouldCreateFlywayHistoryTable() {
        Integer tables = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_name = 'flyway_schema_history'",
                Integer.class);

        assertThat(tables).isEqualTo(1);
    }
}
