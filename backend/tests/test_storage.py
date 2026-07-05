from app.core import storage as storage_module
from app.core.storage import LocalStorage, get_storage


def test_local_storage_save_and_delete(tmp_path, monkeypatch):
    monkeypatch.setattr(storage_module.settings, "UPLOAD_DIR", str(tmp_path))
    store = LocalStorage()

    url = store.save("test-sub/file.txt", b"hello", content_type="text/plain")

    assert url == "/uploads/test-sub/file.txt"
    assert (tmp_path / "test-sub" / "file.txt").read_bytes() == b"hello"

    store.delete("test-sub/file.txt")
    assert not (tmp_path / "test-sub" / "file.txt").exists()


def test_default_backend_is_local():
    get_storage.cache_clear()
    assert isinstance(get_storage(), LocalStorage)
