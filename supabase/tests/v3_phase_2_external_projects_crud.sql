begin;

do $$
declare
  v_user_id uuid;
  v_project_id uuid;
  v_project public.external_projects;
  v_active_count integer;
begin
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then raise exception 'No auth user available for external projects CRUD test'; end if;
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);

  insert into public.external_projects (
    user_id,
    name,
    source_url,
    source_platform,
    source_author,
    source_license,
    description,
    status
  )
  values (
    v_user_id,
    'Projeto Externo V3 Teste',
    'https://example.com/projeto-v3',
    'MakerWorld',
    'Autor Teste',
    'Licenca Teste',
    'Observacao inicial',
    'rascunho'
  )
  returning id into v_project_id;

  select * into v_project from public.external_projects where id = v_project_id and user_id = v_user_id;
  if v_project.name <> 'Projeto Externo V3 Teste' or v_project.source_platform <> 'MakerWorld' then
    raise exception 'External project creation failed';
  end if;

  update public.external_projects
  set
    name = 'Projeto Externo V3 Editado',
    source_platform = 'Printables',
    source_author = 'Autor Editado',
    source_license = 'Licenca Editada',
    description = 'Observacao editada'
  where id = v_project_id and user_id = v_user_id;

  select * into v_project from public.external_projects where id = v_project_id and user_id = v_user_id;
  if v_project.name <> 'Projeto Externo V3 Editado'
    or v_project.source_platform <> 'Printables'
    or v_project.source_author <> 'Autor Editado'
  then
    raise exception 'External project update failed';
  end if;

  update public.external_projects
  set status = 'arquivado'
  where id = v_project_id and user_id = v_user_id;

  select * into v_project from public.external_projects where id = v_project_id and user_id = v_user_id;
  if v_project.status <> 'arquivado' then raise exception 'External project archive failed'; end if;

  select count(*) into v_active_count
  from public.external_projects
  where user_id = v_user_id
    and id = v_project_id
    and status <> 'arquivado';
  if v_active_count <> 0 then raise exception 'Archived project still appears in active query'; end if;
end;
$$;

rollback;
select 'v3_phase_2_external_projects_crud=ok' as result;
