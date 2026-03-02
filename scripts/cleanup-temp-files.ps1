# Cleanup temporary and redundant documentation files

Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan

# List of files to delete (temporary/redundant documentation)
$filesToDelete = @(
    "100_PERCENT_INTEGRATION_COMPLETE.md",
    "ADMIN_PORTAL_RENAME_COMPLETE.md",
    "ADMIN_STATE_CONTROL_QUICK_CARD.txt",
    "API_INTEGRATION_ACTION_PLAN.md",
    "ARTIFACT_API_QUICK_TEST.txt",
    "ARTIFACT_INTEGRATION_SUMMARY.txt",
    "ARTIFACT_MANAGEMENT_INTEGRATION_COMPLETE.md",
    "BACKEND_CONSOLIDATION_GUIDE.md",
    "BACKEND_CONSOLIDATION_PLAN.md",
    "BACKEND_SETUP_COMPLETE.md",
    "BACKEND_SITUATION_EXPLAINED.txt",
    "BETTER_LOGGING_SUMMARY.md",
    "COMPLETE_API_INTEGRATION_STATUS.md",
    "COPY_PASTE_THESE_COMMANDS.txt",
    "DEV_ENVIRONMENT_OPTIONAL_FEATURES.md",
    "EDITABLE_PRESENTATION_GUIDE.md",
    "HACKATHON_PRESENTATION.md",
    "HIDE_EMPTY_STATES_QUICK_GUIDE.txt",
    "HONEST_INTEGRATION_STATUS.md",
    "HOW_TO_SYNC_STATES_ADMIN_TO_MOBILE.txt",
    "IMPLEMENTATION_SUMMARY.md",
    "INTEGRATION_PROGRESS_UPDATE.md",
    "LOCAL_AUTH_SETUP.md",
    "LOCAL_BACKEND_API_REFERENCE.md",
    "LOCAL_BACKEND_SETUP.md",
    "LOCAL_MONITORING_SETUP.md",
    "LOCAL_REDIS_SETUP.md",
    "LOGGING_SETUP_COMPLETE.md",
    "MIGRATION_COMPLETE.md",
    "OPTION_2_COMPLETE.md",
    "PORT_CONFUSION_EXPLAINED.md",
    "PORT_FIX_COMPLETE.md",
    "POWERPOINT_CREATION_STEPS.md",
    "POWERSHELL_TEST_COMMANDS.txt",
    "PRESENTATION_CONTENT_OUTLINE.txt",
    "PRESENTATION_GUIDE.md",
    "PRICING_INTEGRATION_COMPLETE.txt",
    "PRODUCTION_READY_CORRECTION.md",
    "PROJECT_STATUS_AND_COST_ANALYSIS.md",
    "QUICK_POWERPOINT_GUIDE.txt",
    "QUICK_START_AFTER_MIGRATION.txt",
    "QUICK_START_GUIDE.md",
    "README_DEPLOYMENT.md",
    "REAL_PROJECT_STATUS_AND_INFRASTRUCTURE.md",
    "REORGANIZATION_PLAN.md",
    "RUN_ALL_TESTS.md",
    "RUN_TESTS_NOW.txt",
    "RUN_THIS_COMMAND.txt",
    "STATE_MANAGEMENT_IMPLEMENTATION_SUMMARY.md",
    "STATE_MANAGEMENT_VISUAL_GUIDE.md",
    "STATE_SYNC_QUICK_START.md",
    "STATE_SYNC_SOLUTION_SUMMARY.md",
    "STATE_VISIBILITY_FEATURE.md",
    "STATE_VISIBILITY_NOT_SYNCING_FIX.md",
    "SYNC_STATE_VISIBILITY_QUICK.txt",
    "TEMPLE_API_QUICK_TEST.txt",
    "TEMPLE_MANAGEMENT_INTEGRATION_COMPLETE.md",
    "TEST_COVERAGE_ANALYSIS.md",
    "TEST_FIXES_APPLIED.md",
    "TEST_FIXES_COMPLETE.md",
    "TEST_ISSUE_RESOLUTION_SUMMARY.md",
    "TEST_NEW_FEATURES_QUICK_START.txt",
    "TEST_QUICK_START.txt",
    "TEST_SETUP_COMPLETE.md",
    "TEST_SITUATION_FINAL.md",
    "TEST_STATUS_SUMMARY.md",
    "TRUE_100_PERCENT_INTEGRATION_COMPLETE.md",
    "test-runner.ps1",
    "test-with-output.ps1",
    "DEPLOYMENT_READINESS.md"
)

$deletedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    $filePath = Join-Path $PSScriptRoot "..\$file"
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        Write-Host "Deleted: $file" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "Not found: $file" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Cyan
Write-Host "Deleted: $deletedCount files" -ForegroundColor Green
Write-Host "Not found: $notFoundCount files" -ForegroundColor Yellow
