#!/usr/bin/env bash
# Script to enable GCP APIs & create Pub/Sub topic for ALIS
# Project: adaptive-learning-506305 | Region: us-central1

set -e

PROJECT_ID="adaptive-learning-506305"
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
  cloudbuild.googleapis.com

echo "2. Creating Pub/Sub Telemetry Topic: ${TOPIC_NAME}..."
gcloud pubsub topics create "${TOPIC_NAME}" || true

echo "3. Creating Pub/Sub Subscription for Materialized Worker..."
gcloud pubsub subscriptions create alis-telemetry-sub \
  --topic="${TOPIC_NAME}" \
  --ack-deadline=10 || true

echo "=========================================================="
echo "✅ All GCP Services and Pub/Sub Infrastructure Ready!"
echo "=========================================================="
