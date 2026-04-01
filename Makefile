# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: eric <eric@student.42.fr>                  +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/03/03 11:00:00 by eric              #+#    #+#              #
#    Updated: 2026/04/01 14:36:44 by eric             ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# ===================================
# VARIABLES
# ===================================

BFF_DIR = bff
FRONTEND_DIR = frontend

# Couleurs pour les messages
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[0;33m
RED = \033[0;31m
RESET = \033[0m

# ===================================
# COMMANDES PRINCIPALES
# ===================================

.PHONY: all install dev start stop clean fclean re help

# Commande par défaut
all: install

# Afficher l'aide
help:
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BLUE)║           42HUB - Commandes disponibles                  ║$(RESET)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(GREEN)Installation:$(RESET)"
	@echo "  make install      - Installer toutes les dépendances (backend + frontend)"
	@echo "  make install-back - Installer uniquement les dépendances du backend"
	@echo "  make install-front- Installer uniquement les dépendances du frontend"
	@echo ""
	@echo "$(GREEN)Développement:$(RESET)"
	@echo "  make dev          - Lancer backend + frontend en mode développement"
	@echo "  make dev-back     - Lancer uniquement le backend"
	@echo "  make dev-front    - Lancer uniquement le frontend"
	@echo ""
	@echo "$(GREEN)Base de données:$(RESET)"
	@echo "  make db-migrate   - Créer/appliquer les migrations Prisma"
	@echo "  make db-seed      - Remplir la base avec des données de test"
	@echo "  make db-reset     - Réinitialiser la base de données"
	@echo "  make db-studio    - Ouvrir Prisma Studio"
	@echo ""
	@echo "$(GREEN)Production:$(RESET)"
	@echo "  make build        - Builder le frontend pour la production"
	@echo "  make start        - Lancer en mode production"
	@echo ""
	@echo "$(GREEN)Nettoyage:$(RESET)"
	@echo "  make clean        - Nettoyer les fichiers temporaires"
	@echo "  make fclean       - Nettoyage complet (node_modules inclus)"
	@echo "  make re           - Réinstaller complètement le projet"
	@echo ""
	@echo "$(GREEN)Utilitaires:$(RESET)"
	@echo "  make logs         - Afficher les logs"
	@echo "  make stop         - Arrêter tous les serveurs"
	@echo "  make help         - Afficher cette aide"
	@echo ""

# ===================================
# INSTALLATION
# ===================================

install: install-back install-front
	@echo "$(GREEN)✅ Installation complète terminée !$(RESET)"

install-back:
	@echo "$(BLUE)📦 Installation des dépendances BFF...$(RESET)"
	@cd $(BFF_DIR)/authService && npm install
	@cd $(BFF_DIR)/userService && npm install
	@cd $(BFF_DIR)/contentService && npm install
	@cd $(BFF_DIR)/socialService && npm install
	@cd $(BFF_DIR)/backendForFrontend && npm install
	@echo "$(GREEN)✅ BFF installé !$(RESET)"

install-front:
	@echo "$(BLUE)📦 Installation des dépendances frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Frontend installé !$(RESET)"

# ===================================
# DÉVELOPPEMENT
# ===================================

dev:
	@echo "$(BLUE)🚀 Lancement de 42Hub en mode développement...$(RESET)"
	@echo "$(YELLOW)Auth:          https://localhost:3000$(RESET)"
	@echo "$(YELLOW)User:          https://localhost:3001$(RESET)"
	@echo "$(YELLOW)Social:        https://localhost:3002$(RESET)"
	@echo "$(YELLOW)Content:       https://localhost:3003$(RESET)"
	@echo "$(YELLOW)BFF Gateway:   https://localhost:3005$(RESET)"
	@echo "$(YELLOW)Frontend:      http://localhost:5173$(RESET)"
	@echo ""
	@make -j2 dev-back dev-front

dev-back:
	@echo "$(BLUE)🔧 Démarrage du BFF (5 services)...$(RESET)"
	@cd $(BFF_DIR)/authService && npm run dev &
	@cd $(BFF_DIR)/userService && npm run dev &
	@cd $(BFF_DIR)/contentService && npm run dev &
	@cd $(BFF_DIR)/socialService && npm run dev &
	@cd $(BFF_DIR)/backendForFrontend && npm run dev

dev-front:
	@echo "$(BLUE)🎨 Démarrage du frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && npm run dev

# ===================================
# BASE DE DONNÉES
# ===================================

db-migrate:
	@echo "$(BLUE)🗄️  Application des migrations Prisma...$(RESET)"
	@cd $(BFF_DIR)/authService && npx prisma migrate dev
	@cd $(BFF_DIR)/userService && npx prisma migrate dev
	@cd $(BFF_DIR)/contentService && npx prisma migrate dev
	@cd $(BFF_DIR)/socialService && npx prisma migrate dev
	@echo "$(GREEN)✅ Migrations appliquées !$(RESET)"

db-seed:
	@echo "$(BLUE)🌱 Remplissage de la base de données BFF...$(RESET)"
	@echo "$(YELLOW)Note: À implémenter si nécessaire pour chaque service$(RESET)"
	@echo "$(GREEN)✅ Base de données prête !$(RESET)"

db-reset:
	@echo "$(RED)⚠️  Réinitialisation de la base de données BFF...$(RESET)"
	@cd $(BFF_DIR)/authService && npx prisma migrate reset --force
	@cd $(BFF_DIR)/userService && npx prisma migrate reset --force
	@cd $(BFF_DIR)/contentService && npx prisma migrate reset --force
	@cd $(BFF_DIR)/socialService && npx prisma migrate reset --force
	@echo "$(GREEN)✅ Base de données réinitialisée !$(RESET)"

db-studio:
	@echo "$(BLUE)🎨 Ouverture de Prisma Studio (Auth Service)...$(RESET)"
	@cd $(BFF_DIR)/authService && npx prisma studio

# ===================================
# PRODUCTION
# ===================================

build:
	@echo "$(BLUE)🏗️  Build du frontend pour la production...$(RESET)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✅ Build terminé !$(RESET)"

start: build
	@echo "$(BLUE)🚀 Démarrage en mode production...$(RESET)"
	@echo "$(YELLOW)Les services BFF doivent être démarrés manuellement ou via Docker$(RESET)"

# ===================================
# NETTOYAGE
# ===================================

clean:
	@echo "$(YELLOW)🧹 Nettoyage des fichiers temporaires...$(RESET)"
	@cd $(BFF_DIR)/authService && rm -rf dist .next .cache
	@cd $(BFF_DIR)/userService && rm -rf dist .next .cache
	@cd $(BFF_DIR)/contentService && rm -rf dist .next .cache
	@cd $(BFF_DIR)/socialService && rm -rf dist .next .cache
	@cd $(BFF_DIR)/backendForFrontend && rm -rf dist .next .cache
	@cd $(FRONTEND_DIR) && rm -rf dist .next .cache
	@echo "$(GREEN)✅ Nettoyage terminé !$(RESET)"

fclean: clean
	@echo "$(RED)🗑️  Nettoyage complet (node_modules)...$(RESET)"
	@rm -rf $(BFF_DIR)/authService/node_modules
	@rm -rf $(BFF_DIR)/userService/node_modules
	@rm -rf $(BFF_DIR)/contentService/node_modules
	@rm -rf $(BFF_DIR)/socialService/node_modules
	@rm -rf $(BFF_DIR)/backendForFrontend/node_modules
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)✅ Nettoyage complet terminé !$(RESET)"

re: fclean install
	@echo "$(GREEN)✅ Réinstallation complète terminée !$(RESET)"

# ===================================
# UTILITAIRES
# ===================================

stop:
	@echo "$(RED)🛑 Arrêt des serveurs...$(RESET)"
	@pkill -f "npm run dev" || true
	@pkill -f "vite" || true
	@pkill -f "node.*server.js" || true
	@echo "$(GREEN)✅ Serveurs arrêtés !$(RESET)"

logs:
	@echo "$(BLUE)📋 Logs des serveurs...$(RESET)"
	@echo "$(YELLOW)À implémenter selon votre système de logs$(RESET)"

# ===================================
# TESTS (optionnel)
# ===================================

test:
	@echo "$(BLUE)🧪 Lancement des tests...$(RESET)"
	@cd $(FRONTEND_DIR) && npm test

test-back:
	@echo "$(BLUE)🧪 Tests BFF...$(RESET)"
	@echo "$(YELLOW)À implémenter si nécessaire$(RESET)"

test-front:
	@echo "$(BLUE)🧪 Tests frontend...$(RESET)"
	@cd $(FRONTEND_DIR) && npm test

# ===================================
# DOCKER (si vous utilisez Docker)
# ===================================

docker-up:
	@echo "$(BLUE)🐳 Démarrage des conteneurs Docker...$(RESET)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Conteneurs démarrés !$(RESET)"

docker-down:
	@echo "$(RED)🐳 Arrêt des conteneurs Docker...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ Conteneurs arrêtés !$(RESET)"

docker-logs:
	@docker-compose logs -f
