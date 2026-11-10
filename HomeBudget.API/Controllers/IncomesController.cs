using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using HomeBudget.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncomesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IncomesController(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<IncomeResponseDto> IncomeResponses()
        {
            return _context.Incomes
                .AsNoTracking()
                .Select(income => new IncomeResponseDto
                {
                    Id = income.Id,
                    FamilyMemberId = income.FamilyMemberId,
                    FamilyMemberName = income.FamilyMember.FullName,
                    IncomeSourceId = income.IncomeSourceId,
                    IncomeSourceName = income.IncomeSource.Name,
                    Amount = income.Amount,
                    IncomeDate = income.IncomeDate,
                    Notes = income.Notes,
                    CreatedAt = income.CreatedAt
                });
        }

        [HttpGet]
        public async Task<ActionResult<List<IncomeResponseDto>>> GetAll()
        {
            var incomes = await IncomeResponses()
                .OrderByDescending(income => income.IncomeDate)
                .ThenByDescending(income => income.Id)
                .ToListAsync();

            return Ok(incomes);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<IncomeResponseDto>> GetById(int id)
        {
            var income = await IncomeResponses()
                .FirstOrDefaultAsync(record => record.Id == id);

            if (income == null)
            {
                return NotFound(new { message = "Income record not found." });
            }

            return Ok(income);
        }

        [HttpPost]
        public async Task<ActionResult<IncomeResponseDto>> Create(
            IncomeCreateDto dto)
        {
            var validationError = await ValidateIncome(dto);

            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var income = new Income();
            ApplyChanges(income, dto);

            _context.Incomes.Add(income);
            await _context.SaveChangesAsync();

            var response = await IncomeResponses()
                .SingleAsync(record => record.Id == income.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = income.Id },
                response);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<IncomeResponseDto>> Update(
            int id,
            IncomeCreateDto dto)
        {
            var income = await _context.Incomes.FindAsync(id);

            if (income == null)
            {
                return NotFound(new { message = "Income record not found." });
            }

            var validationError = await ValidateIncome(dto, income);

            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            ApplyChanges(income, dto);
            await _context.SaveChangesAsync();

            var response = await IncomeResponses()
                .SingleAsync(record => record.Id == id);

            return Ok(response);
        }

        private async Task<string?> ValidateIncome(
            IncomeCreateDto dto,
            Income? existing = null)
        {
            if (decimal.Round(dto.Amount, 3) != dto.Amount)
            {
                return "Amount must have no more than 3 decimal places.";
            }

            var date = dto.IncomeDate?.Date;

            if (!date.HasValue ||
                date.Value < new DateTime(2000, 1, 1) ||
                date.Value > new DateTime(2100, 12, 31))
            {
                return "Income date must be between 2000 and 2100.";
            }

            if (existing?.FamilyMemberId != dto.FamilyMemberId)
            {
                var memberIsActive = await _context.FamilyMembers
                    .AnyAsync(member =>
                        member.Id == dto.FamilyMemberId && member.IsActive);

                if (!memberIsActive)
                {
                    return "Please select an existing, active family member.";
                }
            }

            if (existing?.IncomeSourceId != dto.IncomeSourceId)
            {
                var sourceIsActive = await _context.IncomeSources
                    .AnyAsync(source =>
                        source.Id == dto.IncomeSourceId && source.IsActive);

                if (!sourceIsActive)
                {
                    return "Please select an existing, active income source.";
                }
            }

            return null;
        }

        private static void ApplyChanges(Income income, IncomeCreateDto dto)
        {
            income.FamilyMemberId = dto.FamilyMemberId;
            income.IncomeSourceId = dto.IncomeSourceId;
            income.Amount = dto.Amount;
            income.IncomeDate = dto.IncomeDate!.Value.Date;
            income.Notes = dto.Notes?.Trim();
        }
    }
}