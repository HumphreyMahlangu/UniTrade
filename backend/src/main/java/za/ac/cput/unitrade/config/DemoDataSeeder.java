package za.ac.cput.unitrade.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import za.ac.cput.unitrade.domain.User;
import za.ac.cput.unitrade.repository.UserRepository;

/**
 * Inserts the documented demo students (README section 7) the first time the app starts on an empty database.
 * Later slices add listings, bulletin posts and a completed order here.
 * Switched off in tests with app.seed.enabled=false.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** Documented demo password (README section 7). Demo accounts only. */
    static final String DEMO_PASSWORD = "Password123!";

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) {
            return; // already seeded (or real users exist): never touch existing data
        }
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        users.save(demoUser("Thabo Nkosi", "thabo@mycput.ac.za", hash));
        users.save(demoUser("Ayesha Daniels", "ayesha@mycput.ac.za", hash));
        users.save(demoUser("Lerato Mokoena", "lerato@mycput.ac.za", hash));
        log.info("Seeded 3 demo students (password: {})", DEMO_PASSWORD);
    }

    private static User demoUser(String name, String email, String passwordHash) {
        return User.builder().fullName(name).email(email).passwordHash(passwordHash).build();
    }
}
