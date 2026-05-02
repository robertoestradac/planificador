#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Copy .env.example to .env and configure it first:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Load environment variables
source .env

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running!"
        exit 1
    fi
    print_success "Docker is running"
}

# Function to deploy with fresh migration
deploy_fresh() {
    print_warning "FRESH MIGRATION MODE - This will DROP ALL TABLES!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    print_info "Setting MIGRATION_MODE=fresh and SEED_ON_BOOT=true..."
    export MIGRATION_MODE=fresh
    export SEED_ON_BOOT=true
    
    deploy_normal
    
    print_warning "IMPORTANT: Change .env to MIGRATION_MODE=normal and SEED_ON_BOOT=false"
    print_warning "Then run: docker-compose restart backend"
}

# Function to deploy normally
deploy_normal() {
    print_info "Starting deployment..."
    
    # Pull latest images
    print_info "Pulling latest images..."
    docker-compose pull
    
    # Build images
    print_info "Building images..."
    docker-compose build --no-cache
    
    # Stop existing containers
    print_info "Stopping existing containers..."
    docker-compose down
    
    # Start services
    print_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Show status
    docker-compose ps
    
    print_success "Deployment completed!"
    print_info "View logs with: docker-compose logs -f"
}

# Function to update from git
update_from_git() {
    print_info "Pulling latest changes from git..."
    git pull origin main
    
    print_info "Rebuilding and restarting services..."
    docker-compose build
    docker-compose up -d
    
    print_success "Update completed!"
}

# Function to create backup
create_backup() {
    print_info "Creating database backup..."
    
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose exec -T mysql mysqldump \
        -u${DB_USER} \
        -p${DB_PASSWORD} \
        ${DB_NAME} > $BACKUP_FILE
    
    print_success "Backup created: $BACKUP_FILE"
}

# Function to restore backup
restore_backup() {
    if [ -z "$1" ]; then
        print_error "Please specify backup file"
        echo "Usage: ./deploy.sh restore <backup_file>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        print_error "Backup file not found: $1"
        exit 1
    fi
    
    print_warning "This will restore the database from: $1"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    print_info "Restoring database..."
    docker-compose exec -T mysql mysql \
        -u${DB_USER} \
        -p${DB_PASSWORD} \
        ${DB_NAME} < $1
    
    print_success "Database restored!"
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f $1
    fi
}

# Function to show status
show_status() {
    print_info "Service status:"
    docker-compose ps
    echo ""
    print_info "Network status:"
    docker network ls | grep -E "web|internal"
    echo ""
    print_info "Volume status:"
    docker volume ls | grep invitaciones
}

# Main script
check_docker

case "$1" in
    fresh)
        deploy_fresh
        ;;
    update)
        update_from_git
        ;;
    backup)
        create_backup
        ;;
    restore)
        restore_backup "$2"
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    *)
        if [ -z "$1" ]; then
            deploy_normal
        else
            print_error "Unknown command: $1"
            echo ""
            echo "Usage: ./deploy.sh [command]"
            echo ""
            echo "Commands:"
            echo "  (no command)  - Deploy normally"
            echo "  fresh         - Deploy with fresh migration (drops all tables)"
            echo "  update        - Pull from git and redeploy"
            echo "  backup        - Create database backup"
            echo "  restore <file>- Restore database from backup"
            echo "  logs [service]- Show logs (optionally for specific service)"
            echo "  status        - Show service status"
            exit 1
        fi
        ;;
esac
