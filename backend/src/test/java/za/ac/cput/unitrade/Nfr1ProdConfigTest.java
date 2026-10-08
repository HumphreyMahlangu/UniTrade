package za.ac.cput.unitrade;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The "prod" profile (used on Render) starts with only the secret environment variables set,
 * and its CORS rule allows the deployed Vercel site but not other origins.
 * The secrets are faked here with an in-memory H2 database.
 */
@SpringBootTest(properties = {
        "DB_URL=jdbc:h2:mem:unitrade-prod-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "DB_USERNAME=sa",
        "DB_PASSWORD=",
        "JWT_SECRET=test-only-secret"
})
@AutoConfigureMockMvc
@ActiveProfiles("prod")
class Nfr1ProdConfigTest {

    private static final String VERCEL_SITE = "https://uni-trade-eight.vercel.app";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void nfr1_01_prodProfileAllowsTheDeployedSiteOnly() throws Exception {
        mockMvc.perform(get("/api/health").header("Origin", VERCEL_SITE))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", VERCEL_SITE));

        // The local dev address must not be allowed in production
        mockMvc.perform(get("/api/health").header("Origin", "http://localhost:5173"))
                .andExpect(status().isForbidden());
    }

    @Test
    void nfr1_02_productionStartNamesMissingSecrets() {
        // Production with only the database URL set: the other three secrets are reported by name
        Map<String, String> env = Map.of("SPRING_PROFILES_ACTIVE", "prod", "DB_URL", "jdbc:mysql://db:3306/x");
        assertEquals(List.of("DB_USERNAME", "DB_PASSWORD", "JWT_SECRET"),
                UnitradeApplication.missingProductionSettings(env));

        // Outside production nothing is required (local runs use defaults / application-local.properties)
        assertTrue(UnitradeApplication.missingProductionSettings(Map.of()).isEmpty());
    }
}
