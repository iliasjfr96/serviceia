from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://serviceia:serviceia_dev_2025@localhost:5432/serviceia"
    anthropic_api_key: str = ""
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
