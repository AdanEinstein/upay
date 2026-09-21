import { AlertError } from 'upay';

export const Errors = () => (
    <div className="w-[28rem]">
        <AlertError
            title="Não foi possível salvar o cliente"
            errors={[
                'O CPF informado já está cadastrado.',
                'O telefone precisa ter DDD.',
            ]}
        />
    </div>
);
