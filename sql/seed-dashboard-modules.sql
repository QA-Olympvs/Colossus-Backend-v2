-- =====================================================
-- Seed: Dashboard Menu Modules
-- Project: Colossus Backend v2
-- Date: 2026-03-27
-- =====================================================

-- =====================================================
-- MENÚ PRINCIPAL (label: 'Menú')
-- =====================================================
INSERT INTO modules (id, name, label, icon, route, description, is_active, "order", is_delivery_module, parent_module_id)
VALUES 
  (gen_random_uuid(), 'orders', 'Órdenes', 'pi-shopping-cart', '/dashboard/orders', 'Gestión de órdenes del sistema', true, 1, false, NULL),
  (gen_random_uuid(), 'orders-history', 'Historial', 'pi-history', '/dashboard/orders-history', 'Historial de órdenes completadas', true, 2, false, NULL),
  (gen_random_uuid(), 'products', 'Productos', 'pi-th-large', '/dashboard/products', 'Catálogo de productos', true, 3, false, NULL),
  (gen_random_uuid(), 'categories', 'Categorías', 'pi-tag', '/dashboard/categories', 'Categorías de productos', true, 4, false, NULL),
  (gen_random_uuid(), 'users', 'Usuarios', 'pi-users', '/dashboard/users', 'Gestión de usuarios del sistema', true, 5, false, NULL),
  (gen_random_uuid(), 'routes', 'Rutas', 'pi-map', '/dashboard/routes', 'Rutas de delivery', true, 6, false, NULL),
  (gen_random_uuid(), 'delivery-routes', 'Repartidor', 'pi-truck', '/dashboard/delivery-routes', 'Módulo de repartidor', true, 7, true, NULL),
  (gen_random_uuid(), 'branches', 'Sucursales', 'pi-building', '/dashboard/branches', 'Sucursales del sistema', true, 8, false, NULL);

-- =====================================================
-- MENÚ PERFIL (label: 'Perfil')
-- =====================================================
INSERT INTO modules (id, name, label, icon, route, description, is_active, "order", is_delivery_module, parent_module_id)
VALUES 
  (gen_random_uuid(), 'settings', 'Configuración', 'pi-cog', '/dashboard/settings', 'Configuración', true, 100, false, NULL);


-- =====================================================
-- NOTAS:
-- =====================================================
-- Para asignar módulos a un rol específico, usar:
-- INSERT INTO role_modules (id, role_id, module_id, created_at, updated_at)
-- VALUES (gen_random_uuid(), '<role_id>', '<module_id>', NOW(), NOW());
--
-- Para ver los módulos insertados:
-- SELECT name, label, route, is_delivery_module FROM modules ORDER BY "order";
