#!/usr/bin/env python3
"""
CDK App for Admin Backend Application

This app creates the infrastructure for the Admin Backend Application.
"""

import aws_cdk as cdk
from stacks.AdminApplicationStack import AdminApplicationStack

app = cdk.App()

AdminApplicationStack(
    app,
    "SanaathanaAalayaCharithra-AdminApp",
    description="Admin Backend Application Infrastructure",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region") or "us-east-1",
    ),
)

app.synth()
