.PHONY: ml train install sync-ui

install:
	pip install -r requirements.txt

ml train:
	@mkdir -p data
	python -m ml.train

sync-ui:
	cp data/iris_results.json frontend/public/iris_results.json
