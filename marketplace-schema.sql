-- =====================================================
-- La Tanda Marketplace - Database Schema
-- Version: 1.0.0
-- Date: 2026-01-11
-- =====================================================

-- 1. SERVICE CATEGORIES
-- Pre-defined categories for services
CREATE TABLE IF NOT EXISTS marketplace_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO marketplace_categories (category_id, name, name_es, icon, sort_order) VALUES
    ('cleaning', 'Home Cleaning', 'Limpieza del Hogar', '🧹', 1),
    ('repairs', 'Repairs', 'Reparaciones', '🔧', 2),
    ('gardening', 'Gardening', 'Jardinería', '🌱', 3),
    ('tutoring', 'Tutoring', 'Tutorías', '📚', 4),
    ('beauty', 'Beauty', 'Belleza', '💅', 5),
    ('moving', 'Moving', 'Mudanzas', '📦', 6),
    ('technology', 'Technology', 'Tecnología', '💻', 7),
    ('health', 'Health', 'Salud', '🏥', 8),
    ('legal', 'Legal', 'Legal', '⚖️', 9),
    ('other', 'Other Services', 'Otros Servicios', '⚙️', 99)
ON CONFLICT (category_id) DO NOTHING;

-- 2. SERVICE PROVIDERS
-- Users who offer services in the marketplace
CREATE TABLE IF NOT EXISTS marketplace_providers (
    provider_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    description TEXT,
    profile_image VARCHAR(500),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),

    -- Location
    city VARCHAR(100) DEFAULT 'Tegucigalpa',
    neighborhood VARCHAR(100),
    service_areas TEXT[], -- Array of areas they serve

    -- Verification & Status
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    verified_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, suspended, inactive

    -- Stats (denormalized for performance)
    avg_rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    response_rate NUMERIC(5,2) DEFAULT 100,
    response_time_hours INTEGER DEFAULT 24,

    -- Settings
    instant_booking BOOLEAN DEFAULT false,
    auto_accept_bookings BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Index for provider lookups
CREATE INDEX IF NOT EXISTS idx_providers_user ON marketplace_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_status ON marketplace_providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_city ON marketplace_providers(city);

-- 3. SERVICES
-- Individual services offered by providers
CREATE TABLE IF NOT EXISTS marketplace_services (
    service_id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES marketplace_providers(provider_id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL REFERENCES marketplace_categories(category_id),

    -- Service Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),

    -- Pricing
    price_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- fixed, hourly, quote
    price NUMERIC(10,2) NOT NULL,
    price_max NUMERIC(10,2), -- For range pricing
    currency VARCHAR(3) DEFAULT 'HNL',

    -- Duration
    duration_hours NUMERIC(4,2), -- Estimated duration
    duration_min_hours NUMERIC(4,2),
    duration_max_hours NUMERIC(4,2),

    -- Availability
    availability JSONB DEFAULT '{}', -- {"monday": ["09:00-12:00", "14:00-18:00"], ...}
    advance_booking_hours INTEGER DEFAULT 24, -- Minimum hours in advance to book
    max_booking_days INTEGER DEFAULT 30, -- How far in advance can book

    -- Media
    images TEXT[], -- Array of image URLs

    -- Status & Visibility
    status VARCHAR(20) DEFAULT 'active', -- active, paused, deleted
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMP,

    -- Stats
    view_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- SEO/Search
    tags TEXT[],
    search_vector TSVECTOR,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for service lookups
CREATE INDEX IF NOT EXISTS idx_services_provider ON marketplace_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON marketplace_services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON marketplace_services(status);
CREATE INDEX IF NOT EXISTS idx_services_featured ON marketplace_services(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_services_price ON marketplace_services(price);

-- 4. BOOKINGS
-- Service bookings/reservations
CREATE TABLE IF NOT EXISTS marketplace_bookings (
    booking_id SERIAL PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL, -- Human-readable code like "BK-2026-XXXX"

    -- Parties
    service_id INTEGER NOT NULL REFERENCES marketplace_services(service_id),
    provider_id INTEGER NOT NULL REFERENCES marketplace_providers(provider_id),
    customer_id VARCHAR(50) NOT NULL REFERENCES users(user_id),

    -- Scheduling
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    scheduled_end_time TIME,
    duration_hours NUMERIC(4,2),

    -- Location
    service_address TEXT,
    service_city VARCHAR(100),
    service_neighborhood VARCHAR(100),
    location_notes TEXT,

    -- Pricing
    quoted_price NUMERIC(10,2) NOT NULL,
    final_price NUMERIC(10,2),
    discount_amount NUMERIC(10,2) DEFAULT 0,
    discount_code VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'HNL',

    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
    payment_method VARCHAR(50), -- wallet, cash, card
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP,

    -- Status Flow: pending -> confirmed -> in_progress -> completed/cancelled
    status VARCHAR(20) DEFAULT 'pending',
    confirmed_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    cancelled_by VARCHAR(50), -- user_id of who cancelled

    -- Communication
    customer_notes TEXT,
    provider_notes TEXT,

    -- Review tracking
    customer_reviewed BOOLEAN DEFAULT false,
    provider_reviewed BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON marketplace_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON marketplace_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON marketplace_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON marketplace_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON marketplace_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON marketplace_bookings(booking_code);

-- 5. REVIEWS
-- Reviews for completed services
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    review_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES marketplace_bookings(booking_id),
    service_id INTEGER NOT NULL REFERENCES marketplace_services(service_id),
    provider_id INTEGER NOT NULL REFERENCES marketplace_providers(provider_id),
    reviewer_id VARCHAR(50) NOT NULL REFERENCES users(user_id),

    -- Review type: customer reviewing provider, or provider reviewing customer
    review_type VARCHAR(20) NOT NULL DEFAULT 'customer_to_provider',

    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

    -- Content
    title VARCHAR(255),
    comment TEXT,

    -- Provider response
    provider_response TEXT,
    provider_responded_at TIMESTAMP,

    -- Moderation
    status VARCHAR(20) DEFAULT 'published', -- published, hidden, flagged
    is_verified_purchase BOOLEAN DEFAULT true,

    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One review per booking per reviewer
    UNIQUE(booking_id, reviewer_id)
);

-- Indexes for review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_service ON marketplace_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON marketplace_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON marketplace_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON marketplace_reviews(overall_rating);

-- 6. USER SUBSCRIPTIONS
-- Marketplace subscription tiers
CREATE TABLE IF NOT EXISTS marketplace_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Tier: free, plan, premium
    tier VARCHAR(20) NOT NULL DEFAULT 'free',

    -- Pricing
    price_monthly NUMERIC(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'HNL',

    -- Dates
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    -- Payment
    payment_method VARCHAR(50),
    last_payment_at TIMESTAMP,
    next_payment_at TIMESTAMP,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, suspended
    auto_renew BOOLEAN DEFAULT true,

    -- Usage tracking
    bookings_this_month INTEGER DEFAULT 0,
    messages_today INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON marketplace_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON marketplace_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON marketplace_subscriptions(status);

-- 7. FAVORITES
-- Users' favorite services/providers
CREATE TABLE IF NOT EXISTS marketplace_favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES marketplace_services(service_id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES marketplace_providers(provider_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Either service or provider must be set
    CHECK (service_id IS NOT NULL OR provider_id IS NOT NULL),
    UNIQUE(user_id, service_id),
    UNIQUE(user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON marketplace_favorites(user_id);

-- 8. MESSAGES (for booking communication)
CREATE TABLE IF NOT EXISTS marketplace_messages (
    message_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES marketplace_bookings(booking_id) ON DELETE CASCADE,
    sender_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
    recipient_id VARCHAR(50) NOT NULL REFERENCES users(user_id),

    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_booking ON marketplace_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON marketplace_messages(recipient_id, is_read);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to generate booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_code := 'BK-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.booking_id::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking code
DROP TRIGGER IF EXISTS trigger_booking_code ON marketplace_bookings;
CREATE TRIGGER trigger_booking_code
    BEFORE INSERT ON marketplace_bookings
    FOR EACH ROW
    WHEN (NEW.booking_code IS NULL)
    EXECUTE FUNCTION generate_booking_code();

-- Function to update provider stats after review
CREATE OR REPLACE FUNCTION update_provider_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update provider stats
    UPDATE marketplace_providers
    SET
        avg_rating = (
            SELECT ROUND(AVG(overall_rating)::numeric, 2)
            FROM marketplace_reviews
            WHERE provider_id = NEW.provider_id AND status = 'published'
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM marketplace_reviews
            WHERE provider_id = NEW.provider_id AND status = 'published'
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE provider_id = NEW.provider_id;

    -- Update service stats
    UPDATE marketplace_services
    SET
        avg_rating = (
            SELECT ROUND(AVG(overall_rating)::numeric, 2)
            FROM marketplace_reviews
            WHERE service_id = NEW.service_id AND status = 'published'
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM marketplace_reviews
            WHERE service_id = NEW.service_id AND status = 'published'
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE service_id = NEW.service_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating stats on new review
DROP TRIGGER IF EXISTS trigger_update_provider_stats ON marketplace_reviews;
CREATE TRIGGER trigger_update_provider_stats
    AFTER INSERT OR UPDATE ON marketplace_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_stats();

-- Function to update booking count
CREATE OR REPLACE FUNCTION update_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        -- Update provider completed jobs
        UPDATE marketplace_providers
        SET completed_jobs = completed_jobs + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE provider_id = NEW.provider_id;

        -- Update service booking count
        UPDATE marketplace_services
        SET booking_count = booking_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE service_id = NEW.service_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking completion
DROP TRIGGER IF EXISTS trigger_update_booking_count ON marketplace_bookings;
CREATE TRIGGER trigger_update_booking_count
    AFTER INSERT OR UPDATE ON marketplace_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_count();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for service listings with provider info
CREATE OR REPLACE VIEW marketplace_service_listings AS
SELECT
    s.service_id,
    s.title,
    s.short_description,
    s.description,
    s.price_type,
    s.price,
    s.price_max,
    s.duration_hours,
    s.images,
    s.status,
    s.is_featured,
    s.avg_rating,
    s.total_reviews,
    s.booking_count,
    s.created_at,
    c.category_id,
    c.name_es as category_name,
    c.icon as category_icon,
    p.provider_id,
    p.business_name as provider_name,
    p.profile_image as provider_image,
    p.is_verified as provider_verified,
    p.avg_rating as provider_rating,
    p.completed_jobs as provider_jobs,
    p.city,
    p.service_areas,
    u.name as provider_user_name
FROM marketplace_services s
JOIN marketplace_providers p ON s.provider_id = p.provider_id
JOIN marketplace_categories c ON s.category_id = c.category_id
JOIN users u ON p.user_id = u.user_id
WHERE s.status = 'active' AND p.status = 'active';

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Note: Uncomment to insert sample data for testing
-- This requires existing user IDs in the users table

/*
-- Sample provider (replace 'user_xxx' with real user_id)
INSERT INTO marketplace_providers (user_id, business_name, description, city, service_areas, status, is_verified)
VALUES ('user_xxx', 'LimpiaHogar Pro', 'Servicio profesional de limpieza del hogar', 'Tegucigalpa', ARRAY['Centro', 'Comayagüela', 'Kennedy'], 'active', true);

-- Sample service
INSERT INTO marketplace_services (provider_id, category_id, title, description, short_description, price_type, price, duration_hours)
VALUES (1, 'cleaning', 'Limpieza Profunda del Hogar', 'Servicio completo de limpieza...', 'Limpieza completa de tu hogar', 'hourly', 150, 3);
*/

-- =====================================================
-- GRANTS (adjust as needed for your setup)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO latanda_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO latanda_app;
