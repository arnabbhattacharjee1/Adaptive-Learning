#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Shell Script: Enable GCP APIs for ALIS
# Project: adaptive-learning-506305
# Region: us-west2
# ==============================================================================

set -euo pipefail

# 1. Set Active GCP Project
gcloud config set project adaptive-learning-506305
gcloud config set compute/region us-west2

echo "🚀 Enabling required GCP APIs for Project adaptive-learning-506305 in us-west2..."

# 2. Enable Required GCP Services
gcloud services enable \
  run.googleapis.com \
  pubsub.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  containerregistry.googleapis.com \
  vpcaccess.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com

echo "✅ All GCP APIs successfully enabled for ALIS deployment!"

# 3. Create Cloud Pub/Sub Topic and Subscription
echo "⚡ Creating Cloud Pub/Sub Topic & Subscription..."
gcloud pubsub topics create alis-telemetry-topic --project=adaptive-learning-506305 || true
gcloud pubsub subscriptions create alis-telemetry-sub --topic=alis-telemetry-topic --project=adaptive-learning-506305 || true

echo "🎉 GCP Infrastructure Initialization Complete!"
