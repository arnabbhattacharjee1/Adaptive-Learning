#!/usr/bin/env bash
set -e

PROJECT_ID="adaptive-learning-506305"
REGION="us-central1"
SERVICE_NAME="alis-service"
REPO_NAME="alis-repo"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/alis-app:latest"

echo "========================================================"
echo "🚀 Deploying ALIS to GCP Cloud Run (${REGION})"
echo "========================================================"

# 1. Set Active GCP Project
gcloud config set project "${PROJECT_ID}"

# 2. Enable Required APIs & PubSub Topic
chmod +x ./gcp-enable-apis.sh
./gcp-enable-apis.sh

# 3. Create Artifact Registry Repository (if not existing)
echo "📦 Creating Artifact Registry repository '${REPO_NAME}'..."
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="ALIS Container Repository" || true

# 4. Build Container Image via Cloud Build
echo "🏗️ Building container image via Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" ./backend

# 5. Deploy Container to GCP Cloud Run
echo "☁️ Deploying service '${SERVICE_NAME}' to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars=GCP_PROJECT_ID="${PROJECT_ID}",GCP_REGION="${REGION}",NODE_ENV=production

echo "========================================================"
echo "✅ ALIS Successfully Deployed to GCP Cloud Run in ${REGION}!"
echo "========================================================"
