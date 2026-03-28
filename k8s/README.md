# Vortex Client - Kubernetes Deployment

Independent deployment for the Vortex frontend application.

## Prerequisites

- Kubernetes 1.28+
- kubectl configured with cluster access
- NGINX Ingress Controller installed
- cert-manager for TLS certificates
- Container registry access (e.g., GHCR, Docker Hub)

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Configure ConfigMap

Edit `k8s/configmap.yaml` with your API URL:

```yaml
VITE_API_URL: https://api.vortex.example.com/api
VITE_CLOUDINARY_CLOUD_NAME: your-cloud-name
```

Apply config:
```bash
kubectl apply -f k8s/configmap.yaml
```

### 3. Deploy

```bash
# Deploy all resources
kubectl apply -f k8s/

# Or deploy in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

## Resources Created

| Resource | Name | Description |
|----------|------|-------------|
| Namespace | vortex-client | Isolated namespace |
| Deployment | vortex-client | 2 replicas, auto-scaling 2-10 |
| Service | vortex-client | ClusterIP on port 80 |
| HPA | vortex-client-hpa | CPU 70%, Memory 80% |
| Ingress | vortex-client-ingress | vortex.example.com |
| ConfigMap | vortex-client-config | Environment config |

## Docker

### Build locally
```bash
docker build -t vortex-client .
docker run -p 80:5173 vortex-client
```

### Docker Compose
```bash
# Set environment variables
export VITE_API_URL=http://localhost:3000/api

docker-compose up -d
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| VITE_API_URL | Yes | - | Backend API URL |
| VITE_CLOUDINARY_CLOUD_NAME | No | - | Cloudinary cloud name |

## Troubleshooting

```bash
# Check pods
kubectl get pods -n vortex-client

# View logs
kubectl logs -n vortex-client -l app=vortex-client

# Describe deployment
kubectl describe deployment vortex-client -n vortex-client

# Rollback
kubectl rollout undo deployment/vortex-client -n vortex-client

# Scale manually
kubectl scale deployment vortex-client --replicas=5 -n vortex-client
```

## CI/CD

GitHub Actions workflow: `.github/workflows/client-ci.yaml`

- **Pull Requests**: Deploys preview to Vercel
- **develop branch**: Deploys to `vortex-client-staging` namespace
- **main branch**: Deploys to `vortex-client` namespace
- **Tags v***: Production deployment with Docker image tagging

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         K8s Cluster                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐      ┌─────────────────────────┐   │
│  │   vortex-client     │      │    vortex-server        │   │
│  │   (Frontend)        │      │    (Backend API)        │   │
│  │                     │      │                         │   │
│  │  ┌───────────────┐  │      │  ┌─────────────────┐   │   │
│  │  │ nginx         │  │      │  │ Express Server  │   │   │
│  │  │ (ingress)     │  │      │  │                 │   │   │
│  │  └───────────────┘  │      │  └────────┬────────┘   │   │
│  │         │           │      │           │              │   │
│  │  ┌──────┴──────┐   │      │  ┌────────┴────────┐   │   │
│  │  │ vite preview │   │      │  │ PostgreSQL      │   │   │
│  │  │ :5173        │   │      │  │ Redis          │   │   │
│  │  └──────────────┘   │      │  └─────────────────┘   │   │
│  └─────────────────────┘      └─────────────────────────┘   │
│                                                              │
│  vortex.example.com ◄─────── Ingress ──────── api.vortex... │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
