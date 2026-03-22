# AO - The Overgod Deployment

This application is structured for local deployment using Docker and Ansible.

## Prerequisites
- Docker & Docker Compose
- Ansible

## Local Deployment with Ansible

1. **Run the Playbook:**
   ```bash
   ansible-playbook -i hosts.ini deploy.yml
   ```

This will:
- Ensure Docker is installed and running.
- Build the application container.
- Start the Ollama container.
- Pull the `llama3` model automatically.
- Expose the app at `http://localhost:3000`.

## Manual Deployment

If you prefer not to use Ansible:
```bash
docker-compose up --build -d
docker exec -it ao-the-overgod-ollama-1 ollama pull llama3
```

## Configuration
- **Ollama URL:** Defaults to `http://ollama:11434` inside the Docker network.
- **Model:** Default is `llama3`. You can change this in `deploy.yml` or `App.tsx`.
