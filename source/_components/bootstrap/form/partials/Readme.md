All partials in here can be accessed via a shortcut:

	= input :text, :value => 'Yo'

equals

	= part 'components/bootstrap/form/partials/input_text', :value => 'Yo'

And

	= form :row do ...

equals

	= part 'components/bootstrap/form/partials/row' do
