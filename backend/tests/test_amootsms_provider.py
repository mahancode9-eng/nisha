"""AmootSMS provider unit tests (no live network)."""

from unittest.mock import MagicMock, patch

import pytest

from app.core import config
from app.services.notification_service import AmootSmsProvider, _amootsms_mobile, get_sms_provider


def test_amootsms_mobile_normalizes_iran_formats():
    assert _amootsms_mobile("09121234567") == "9121234567"
    assert _amootsms_mobile("+989121234567") == "9121234567"
    assert _amootsms_mobile("989121234567") == "9121234567"
    assert _amootsms_mobile("9121234567") == "9121234567"


def test_amootsms_send_success(monkeypatch):
    monkeypatch.setattr(config.settings, "AMOOTSMS_TOKEN", "test-token")
    monkeypatch.setattr(config.settings, "AMOOTSMS_LINE_NUMBER", "public")

    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = {"Status": "Success", "Data": []}

    with patch("httpx.post", return_value=mock_response) as post:
        AmootSmsProvider().send("+989121234567", "سلام نیشا")

    assert post.call_count == 1
    kwargs = post.call_args.kwargs
    assert kwargs["headers"]["Authorization"] == "test-token"
    assert kwargs["data"]["Mobiles"] == "9121234567"
    assert kwargs["data"]["SMSMessageText"] == "سلام نیشا"


def test_amootsms_send_rejects_banned_status(monkeypatch):
    monkeypatch.setattr(config.settings, "AMOOTSMS_TOKEN", "test-token")
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = {"Status": "User_WebServiceBanned"}

    with patch("httpx.post", return_value=mock_response):
        with pytest.raises(RuntimeError, match="User_WebServiceBanned"):
            AmootSmsProvider().send("09121234567", "x")


def test_get_sms_provider_amootsms(monkeypatch):
    monkeypatch.setattr(config.settings, "SMS_PROVIDER", "amootsms")
    assert isinstance(get_sms_provider(), AmootSmsProvider)
