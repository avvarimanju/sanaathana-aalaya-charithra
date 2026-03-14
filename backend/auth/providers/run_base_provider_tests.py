#!/usr/bin/env python3
"""
Simple test runner for base provider tests.
This script validates that the tests can be imported and basic functionality works.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

def test_imports():
    """Test that all imports work correctly."""
    try:
        from auth.providers.base_provider import BaseOAuthProvider
        from auth.providers.test_base_provider import ConcreteProvider, TestBaseOAuthProvider
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_abstract_enforcement():
    """Test that abstract method enforcement works."""
    try:
        from auth.providers.test_base_provider import IncompleteProvider
        
        # This should raise TypeError
        try:
            IncompleteProvider(
                client_id="test",
                client_secret="test",
                redirect_uri="https://test.com",
                scopes=["openid"],
                provider_name="test"
            )
            print("✗ Abstract method enforcement failed - should not be able to instantiate")
            return False
        except TypeError as e:
            if "Can't instantiate abstract class" in str(e):
                print("✓ Abstract method enforcement works correctly")
                return True
            else:
                print(f"✗ Unexpected TypeError: {e}")
                return False
    except Exception as e:
        print(f"✗ Error testing abstract enforcement: {e}")
        return False

def test_concrete_implementation():
    """Test that concrete implementation works."""
    try:
        from auth.providers.test_base_provider import ConcreteProvider
        
        provider = ConcreteProvider(
            client_id="test_client_id",
            client_secret="test_client_secret",
            redirect_uri="https://app.example.com/callback",
            scopes=["openid", "email", "profile"],
            provider_name="test_provider"
        )
        
        # Test basic properties
        assert provider.client_id == "test_client_id"
        assert provider.provider_name == "test_provider"
        assert len(provider.scopes) == 3
        
        # Test helper methods
        state = provider.generate_state()
        assert isinstance(state, str)
        assert len(state) > 0
        
        # Test PKCE methods
        verifier = provider.generate_code_verifier()
        challenge = provider.generate_code_challenge(verifier)
        assert isinstance(verifier, str)
        assert isinstance(challenge, str)
        
        # Test state validation
        assert provider.validate_state(state, state) is True
        assert provider.validate_state(state, "different") is False
        
        print("✓ Concrete implementation works correctly")
        return True
        
    except Exception as e:
        print(f"✗ Error testing concrete implementation: {e}")
        return False

def test_helper_methods():
    """Test common helper methods."""
    try:
        from auth.providers.test_base_provider import ConcreteProvider
        
        provider = ConcreteProvider(
            client_id="test",
            client_secret="test",
            redirect_uri="https://test.com",
            scopes=["openid"],
            provider_name="test"
        )
        
        # Test URL building
        url = provider.build_authorization_url(
            "https://example.com/auth",
            {"client_id": "test", "scope": "openid"}
        )
        assert "https://example.com/auth?" in url
        assert "client_id=test" in url
        
        # Test query parameter parsing
        params = provider.parse_query_params("https://test.com?code=123&state=abc")
        assert params["code"] == "123"
        assert params["state"] == "abc"
        
        print("✓ Helper methods work correctly")
        return True
        
    except Exception as e:
        print(f"✗ Error testing helper methods: {e}")
        return False

def main():
    """Run all tests."""
    print("Running Base Provider Tests...")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_abstract_enforcement,
        test_concrete_implementation,
        test_helper_methods
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Base provider implementation is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())