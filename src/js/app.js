App = {
    web3Provider: null,
    contracts: {},

    init: function() {
        // Load pets.
        $.getJSON('../pets.json', function(data) {
            var petsRow = $('#petsRow');
            var petTemplate = $('#petTemplate');

            for (i = 0; i < data.length; i ++) {
                petTemplate.find('.panel-title').text(data[i].name);
                petTemplate.find('img').attr('src', data[i].picture);
                petTemplate.find('.pet-breed').text(data[i].breed);
                petTemplate.find('.pet-age').text(data[i].age);
                petTemplate.find('.pet-location').text(data[i].location);
                petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
                petTemplate.find('.btn-rename').attr('data-id', data[i].id);

                petsRow.append(petTemplate.html());
            }
        });

        return App.initWeb3();
    },

    initWeb3: function() {
        // Initialize web3 and set the provider to the testRPC.
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            App.web3Provider = new Web3.providers.HttpProvider('https://www.web3.ttt222.org/');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function() {
		$.getJSON('Adoption.json', function(data) {
			// Get the necessary contract artifact file and instantiate it with truffle-contract.
			var AdoptionArtifact = data;
			App.contracts.Adoption = TruffleContract(AdoptionArtifact);

			// Set the provider for our contract.
			App.contracts.Adoption.setProvider(App.web3Provider);

			// Use our contract to retieve and mark the adopted pets.
            App.markAdopted()
            App.markRenamed();

        }).then(function() {
            var adoptionInstance;
            web3.eth.getBlock('latest', function(error, result) {
                console.log("result = " + JSON.stringify(result));
                lastblock = result.number + 1;
                console.log("latest block: " + JSON.stringify(lastblock));

                App.contracts.Adoption.deployed().then(function(instance) {
                    adoptionInstance = instance;

                    adoptionInstance.Rename({}, {fromBlock: lastblock, toBlock: 'latest'}).watch(function(error, response) {
                        console.log("error = " + JSON.stringify(error));
                        console.log("response = " + JSON.stringify(response));
                        console.log(response.args.sender + " has renamed pet #" + response.args.petId + " to \"" + web3.toAscii(response.args.newName) + "\"");
                        App.markRenamed();
                    });
                });
            });
        });
        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '.btn-adopt', App.handleAdopt);
        $(document).on('click', '.btn-rename', App.handleRename);
    },

    handleAdopt: function() {
        event.preventDefault();

        var petId = parseInt($(event.target).data('id'));

		var adoptionInstance;

		web3.eth.getAccounts(function(error, accounts) {
			if (error) {
				console.log(error);
			}

			var account = accounts[0];

			App.contracts.Adoption.deployed().then(function(instance) {
				adoptionInstance = instance;

				return adoptionInstance.adopt(petId, {from: account});
			}).then(function(result) {
				return App.markAdopted();
			}).catch(function(err) {
				console.log("Error while handling adoption: " + err.message);
			});
		});
    },

    markAdopted: function(adopters, account) {
		var adoptionInstance;

		App.contracts.Adoption.deployed().then(function(instance) {
			adoptionInstance = instance;

			return adoptionInstance.getAdopters.call();
		}).then(function(adopters) {
			for (i = 0; i < adopters.length; i++) {
				if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
					$('.panel-pet').eq(i).find('.btn-adopt').text('Pending...').attr('disabled', true);
				}
			}
		}).catch(function(err) {
			console.log("Error while marking adoption: " + err.message);
		});
    },

    handleRename: function() {
        event.preventDefault();

        var petId = parseInt($(event.target).data('id'));

        var $namebox = $('.panel-pet').eq(petId).find('.txt-rename');
		var newName = $namebox.val();
        console.log("you want to rename pet " + petId + " to \"" + newName + "\"");
        if (newName == '') {
            return;
        }

        var $renamebtn = $('.panel-pet').eq(petId).find('.btn-rename');
        $renamebtn.attr('disabled', true);

		var adoptionInstance;

		web3.eth.getAccounts(function(error, accounts) {
			if (error) {
				console.log("Error while getting accounts: " + JSON.stringify(error));
                return;
			}

			var account = accounts[0];

			App.contracts.Adoption.deployed().then(function(instance) {
				adoptionInstance = instance;
                console.log("renaming...");
                return adoptionInstance.rename(petId, newName, {from: account});
            }).then(function(result) {
                console.log("result.tx = " + result.tx);
                console.log("result.logs = " + JSON.stringify(result.logs));
                console.log("result.receipt = " + JSON.stringify(result.receipt));
                $namebox.val('');
                $renamebtn.attr('disabled', false);
                //return App.markRenamed();
			}).catch(function(err) {
				console.log("Error while handling rename: " + err.message);
			});
		});

    },

    markRenamed: function() {
        console.log("marking renamed");
		var adoptionInstance;

		App.contracts.Adoption.deployed().then(function(instance) {
			adoptionInstance = instance;

			return adoptionInstance.getPetNames.call();
		}).then(function(petNames) {
			for (i = 0; i < petNames.length; i++) {
                var name = web3.toAscii(petNames[i]);
				if (petNames[i] !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    console.log("petNames[" + i + "] = \"" + petNames[i] + "\" == \"" + name + "\"");
					$('.panel-pet').eq(i).find('.panel-title').html(name);
				}
			}
		}).catch(function(err) {
			console.log("Error while marking renamed: " + err.message);
		});
    }

};

$(function() {
    $(window).load(function() {
        App.init();
    });
});
