FROM python:3.8-slim-buster

ENV PYTHONUNBUFFERED 1

RUN apt-get update -y && \
    apt-get install -y python-pip python-dev

RUN pip install --user poetry

COPY ./server/poetry.lock /poetry.lock

WORKDIR /app

RUN poetry install

COPY . /app

ENTRYPOINT [ "poetry shell" ]
