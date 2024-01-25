zipname = 8rainstation-enhancer.zip
clean:
	rm -rf *~
	rm -f ./${zipname}

8rainstation-enhancer.zip: ./src/*
	cd ./src; zip ../${zipname} *

build: ${zipname}
