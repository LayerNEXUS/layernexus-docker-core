from setuptools import setup

# Dynamically read version
version_ns = {}
with open("backend/__version__.py") as f:
    exec(f.read(), version_ns)

setup(
    name="layernexus",
    version=version_ns["__version__"],
    author="Max Kuan",
    author_email="founder@layernexus.com",
)