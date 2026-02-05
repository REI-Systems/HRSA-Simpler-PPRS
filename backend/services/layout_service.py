"""
Layout Service
Handles business logic for menu and header nav; uses layout_repository.
"""
from repositories.layout_repository import get_menu as repo_get_menu, get_header_nav as repo_get_header_nav


def get_menu():
    """Return sidebar menu items."""
    return repo_get_menu()


def get_header_nav():
    """Return header navigation items."""
    return repo_get_header_nav()
