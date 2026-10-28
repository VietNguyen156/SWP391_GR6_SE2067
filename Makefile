.PHONY: help setup teardown run-backend run-frontend run-all

help:
	@echo "Targets:"
	@echo "  make setup         Start the MySQL dependency"
	@echo "  make teardown     Stop MySQL and keep its data volume"
	@echo "  make run-backend  Run Spring Boot on localhost:8080"
	@echo "  make run-frontend Run Vite on localhost:5173"
	@echo "  make run-all      Build and run the full stack with Docker Compose"

setup:
	docker compose up -d mysql

teardown:
	# Clean up everything, including the MySQL data volume and orphan containers
	docker compose down -v --remove-orphans

	# Use this if you want to keep the MySQL data volume and orphan containers
	# docker compose down --remove-orphans

run-backend:
	cd backend && mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:mysql://localhost:3307/toeic_learning?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh"

run-frontend:
	cd frontend && npm run dev

run-all:
	docker compose up --build
