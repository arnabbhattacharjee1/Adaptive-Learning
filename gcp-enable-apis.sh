#!/usr/bin/env bash
# Script to enable GCP APIs, grant Developer Connect IAM roles & create Pub/Sub infrastructure
# Project: adaptive-learning-506305 | Region: us-central1

set -e

PROJECT_ID="adaptive-learning-506305"
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
REGION="us-central1"
TOPIC_NAME="alis-telemetry-events"

echo "=========================================================="
echo "🚀 Enabling GCP Services for Project: ${PROJECT_ID} (${REGION})"
echo "=========================================================="

gcloud config set project "${PROJECT_ID}"

echo "1. Enabling GCP Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  developerconnect.googleapis.com

echo "2. Granting Developer Connect & Cloud Run IAM Roles to Cloud Build Service Account..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/developerconnect.user" || true

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin" || true

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" || true

echo "3. Creating Pub/Sub Telemetry Topic: ${TOPIC_NAME}..."
gcloud pubsub topics create "${TOPIC_NAME}" || true

echo "4. Creating Pub/Sub Subscription for Materialized Worker..."
gcloud pubsub subscriptions create alis-telemetry-sub \
  --topic="${TOPIC_NAME}" \
  --ack-deadline=10 || true

echo "=========================================================="
echo "✅ All GCP Services, Developer Connect IAM Roles, and Pub/Sub Infrastructure Ready!"
echo "=========================================================="
