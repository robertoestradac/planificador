#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Verificación de Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Estado de contenedores
echo -e "${YELLOW}1. Estado de contenedores:${NC}"
docker compose ps
echo ""

# 2. Logs del backend (últimas 50 líneas)
echo -e "${YELLOW}2. Logs del backend (últimas 50 líneas):${NC}"
docker compose logs --tail=50 backend
echo ""

# 3. Verificar health check
echo -e "${YELLOW}3. Verificando health check del backend:${NC}"
sleep 5
docker compose exec backend wget -qO- http://localhost:4000/health || echo -e "${RED}Health check falló${NC}"
echo ""

# 4. Estado de MySQL
echo -e "${YELLOW}4. Estado de MySQL:${NC}"
docker compose exec mysql mysqladmin ping -h localhost -uroot -p${DB_ROOT_PASSWORD} 2>/dev/null && echo -e "${GREEN}✅ MySQL está funcionando${NC}" || echo -e "${RED}❌ MySQL no responde${NC}"
echo ""

# 5. Verificar tablas creadas
echo -e "${YELLOW}5. Verificando tablas en la base de datos:${NC}"
docker compose exec mysql mysql -uroot -p${DB_ROOT_PASSWORD} -e "USE ${DB_NAME}; SHOW TABLES;" 2>/dev/null | wc -l
echo ""

# 6. Verificar permisos creados
echo -e "${YELLOW}6. Verificando permisos en la base de datos:${NC}"
docker compose exec mysql mysql -uroot -p${DB_ROOT_PASSWORD} -e "USE ${DB_NAME}; SELECT COUNT(*) as total_permissions FROM permissions;" 2>/dev/null
echo ""

# 7. Verificar que el GIF block permission existe
echo -e "${YELLOW}7. Verificando permiso builder_block_gif:${NC}"
docker compose exec mysql mysql -uroot -p${DB_ROOT_PASSWORD} -e "USE ${DB_NAME}; SELECT * FROM permissions WHERE key_name='builder_block_gif';" 2>/dev/null
echo ""

# 8. Verificar companion fields
echo -e "${YELLOW}8. Verificando campos de companions en plan_seat_assignments:${NC}"
docker compose exec mysql mysql -uroot -p${DB_ROOT_PASSWORD} -e "USE ${DB_NAME}; DESCRIBE plan_seat_assignments;" 2>/dev/null | grep -E "is_companion|companion_index"
echo ""

# 9. Redes Docker
echo -e "${YELLOW}9. Redes Docker:${NC}"
docker network ls | grep -E "web|internal"
echo ""

# 10. Volúmenes
echo -e "${YELLOW}10. Volúmenes Docker:${NC}"
docker volume ls | grep planificador
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Verificación completada${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}URLs del sistema:${NC}"
echo -e "  Frontend: ${GREEN}https://planificador.app${NC}"
echo -e "  Backend:  ${GREEN}https://api.planificador.app${NC}"
echo -e "  Health:   ${GREEN}https://api.planificador.app/health${NC}"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo -e "  Ver logs:        ${BLUE}docker compose logs -f [service]${NC}"
echo -e "  Reiniciar:       ${BLUE}docker compose restart [service]${NC}"
echo -e "  Estado:          ${BLUE}docker compose ps${NC}"
echo -e "  Entrar a MySQL:  ${BLUE}docker compose exec mysql mysql -uroot -p${NC}"
echo ""
