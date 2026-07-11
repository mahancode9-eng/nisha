from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SELLER = "SELLER"


class PaymentMethodType(str, Enum):
    CARD_TO_CARD = "CARD_TO_CARD"
    CRYPTO = "CRYPTO"
    EXTERNAL_GATEWAY = "EXTERNAL_GATEWAY"


class SenderType(str, Enum):
    SELLER = "SELLER"
    CUSTOMER = "CUSTOMER"


class OrderStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAYMENT_UPLOADED = "PAYMENT_UPLOADED"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    PAYMENT_REJECTED = "PAYMENT_REJECTED"
    PREPARING = "PREPARING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class RecoveryChannel(str, Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"


class VerificationAccountKind(str, Enum):
    CUSTOMER = "CUSTOMER"
    USER = "USER"


class CustomerReceiptStatus(str, Enum):
    RECEIVED = "RECEIVED"
    NOT_RECEIVED = "NOT_RECEIVED"


class ComplaintStatus(str, Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"


class ProductFieldType(str, Enum):
    TEXT = "TEXT"
    TEXTAREA = "TEXTAREA"
    NUMBER = "NUMBER"
    DROPDOWN = "DROPDOWN"
    RADIO = "RADIO"
    CHECKBOX = "CHECKBOX"
    FILE_UPLOAD = "FILE_UPLOAD"


class ReviewStatus(str, Enum):
    PRIVATE = "PRIVATE"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class StoreBadgeType(str, Enum):
    VERIFIED = "VERIFIED"
    TRUSTED = "TRUSTED"
    PREMIUM = "PREMIUM"


class StoreOnboardingStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SKIPPED = "SKIPPED"
    COMPLETED = "COMPLETED"


class StoreOnboardingStep(str, Enum):
    WELCOME = "welcome"
    STORE_IDENTITY = "store_identity"
    STORE_INFORMATION = "store_information"
    CONTACT_CHANNELS = "contact_channels"
    FIRST_PRODUCT = "first_product"
    EDUCATION = "education"
    ACTIVATION = "activation"
